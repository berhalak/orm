import { List } from "./";

test('in memory with anonymous', async () => {
	class Person {
		constructor(private name: string) {

		}

		hello() {
			return this.name;
		}
	}

	const list = new List<Person>("id");
	const bobId = await list.push(new Person("bob"));
	const johnId = await list.push(new Person("john"));

	const bob = await list.get(bobId);
	const john = await list.get(johnId);

	expect(bob.hello()).toBe("bob");
})

test('with mapping', async () => {
	class Person {
		id = '';
		constructor(private name: string) {
			this.id = name;
		}

		hello() {
			return this.name;
		}
	}

	const list = new List<Person, { code: string }>("id");
	list.index("code", x => x.hello());

	await list.push(new Person("bob"));
	await list.push(new Person("john"));

	const bob = await list.get("bob");
	const john = await list.get("john");

	expect(bob.hello()).toBe("bob");
})

test('in memory with id', async () => {
	class Person {
		id = '';
		constructor(private name: string) {
			this.id = name;
		}

		hello() {
			return this.name;
		}
	}

	const list = new List<Person>("id");
	List.use(Person);

	await list.push(new Person("bob"));
	await list.push(new Person("john"));

	const bob = await list.get("bob");
	const john = await list.get("john");

	expect(bob.hello()).toBe("bob");
})

test('linq', async () => {
	class Person {
		id = '';
		constructor(private name: string) {
			this.id = name;
		}

		hello() {
			return this.name;
		}
	}

	type Index = { code: string };

	const list = new List<Person, Index>("id");
	List.use(Person);
	list.index("code", x => x.hello());


	await list.push(new Person("bob"));
	await list.push(new Person("john"));

	const bob = await list.where("code").eq("bob").first();

	expect(bob.hello()).toBe("bob");
})