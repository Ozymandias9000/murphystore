const Mutations = {
  async createItem(parent, args, ctx, info) {
    // Check login
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args
        }
      },
      info
    );
    return item;
  },
  updateItem(parent, args, ctx, info) {
    //  Copy updates
    const updates = { ...args };
    //  remove ID from updates
    delete updates.id;
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info
    );
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. find item
    const item = await ctx.db.query.item({ where }, `{id, title}`);
    // 2. Check if they own the item or permissions
    // TODO
    // 3. Delete
    return ctx.db.mutation.deleteItem({ where }, info);
  }
};

module.exports = Mutations;
