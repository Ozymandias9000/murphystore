const Mutations = {
  async createItem(parent, args, ctx, info) {
    // Check login

    const item = await ctx.db.mutation.this.createItem(
      {
        data: {
          ...args
        }
      },
      info
    );
    return item;
  }
};

module.exports = Mutations;
