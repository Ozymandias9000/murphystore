function Person(name, foods) {
  this.name = name;
  this.foods = foods;
}

Person.prototype.fetchFoods = function() {
  return new Promise((res, rej) => {
    setTimeout(() => res(this.foods), 200);
  });
};

describe("mocking func", () => {
  it("mocks a function", () => {
    const fetchDogs = jest.fn();
    fetchDogs("Bruno");
    expect(fetchDogs).toHaveBeenCalled();
    expect(fetchDogs).toHaveBeenCalledWith("Bruno");
  });

  it("can make a person", () => {
    const me = new Person("Nick", ["Pizza", "Sushi"]);
    expect(me).toBeInstanceOf(Person);
  });

  it("can fetch foods", async () => {
    const me = new Person("Nick", ["Pizza", "Sushi"]);
    const favFoods = await me.fetchFoods();

    expect(favFoods).toContain("Pizza");
  });
});
