import { UUID } from "@berhalak/js"
import { Packer } from "packer-js"


type Visitor = (id: string, item: any) => void | PromiseLike<void>;

export interface Persistance {
	set(id: string, model: any): Promise<void>;
	get(id: string): Promise<any>;
	all(visitor: Visitor): Promise<void>;
	change(id: string, data: any): Promise<void>;
	update(visitor: Visitor): Promise<void>;
}

export class InMemory implements Persistance {
	async all(visitor: Visitor): Promise<void> {
		for (const id in this.db) {
			await visitor(id, this.db[id]);
		}
	}

	private db: any = {};

	set(id: string, model: any): Promise<void> {
		this.db[id] = model;
		return Promise.resolve();
	}

	get(id: string): Promise<any> {
		return Promise.resolve(this.db[id]);
	}

	constructor(private id: string) {

	}
}


export class List<T, M = any> {

	public static default: any = InMemory;

	constructor(private id: string, private db: Persistance = null) {
		if (!db) this.db = new List.default(id);
	}

	static use<T>(ctr: Constructor<T>) {
		Packer.register(ctr);
	}

	private static indexes: any = {};

	async pull() {
		await this.db.update((id, diff) => {
			this.indexes[id] = this.indexes[id] || {};
			Object.assign(this.indexes[id], diff);
		});
	}

	async push(model: T): Promise<string>
	async push(id: string, model: T): Promise<string>
	async push(...args: any[]): Promise<string> {
		if (args.length == 1) {
			const model = args[0];
			const id = (typeof model.id == 'function' ? model.id() : model.id) ?? UUID();
			await this.db.set(id, await this.build(id, model));
			return id;
		} else {
			const id = args[0];
			const model = args[1];
			const row = await this.build(id, model)
			await this.db.set(id, row);
			return id;
		}
	}



	private async build(id: string, model: T) {
		const row: any = {};

		for (const key of this.indexes) {
			const value = this.indexes[key](model);
			row[key] = value;
		}

		await this.db.change(id, row);

		return Packer.pack(model);
	}

	async get(id: string): Promise<T> {
		const model = await this.db.get(id);
		return model ? Packer.unpack(model) : null;
	}

	private indexes: any = {};

	index(name: keyof M, selector: (model: T) => any) {
		this.indexes[name] = selector;
	}

	async where(selector: (i: M) => boolean) {
		const ids = Object.entries(this.indexes).filter(x => selector(x[1] as any)).map(x => x[0]);
		const re = [];
		for (const id of ids) {
			re.push(await this.get(id));
		}
		return re;
	}
}

