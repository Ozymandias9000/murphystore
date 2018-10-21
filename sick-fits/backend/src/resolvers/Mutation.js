const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { transport, makeANiceEmail } = require("../mail");
const { hasPermission } = require("../utils");

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // Check login
    if (!ctx.request.userId) throw new Error("You must be logged in!");

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          // How to make relation between user and item
          // So easy!
          user: {
            connect: {
              id: ctx.request.userId
            }
          },
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
    const item = await ctx.db.query.item({ where }, `{id title user { id }}`);
    // 2. Check if they own the item or permissions
    const ownsItem = item.user.id === ctx.request.userId;

    if (!ownsItem) throw new Error("You aren't allowed!");

    const hasPermissions = ctx.request.user.permissions.some(per =>
      ["ADMIN", "ITEMDELETE"].includes(per)
    );

    if (ownsItem || hasPermissions) {
      return ctx.db.mutation.deleteItem({ where }, info);
    } else throw new Error("You aren't allowed!");
    // 3. Delete
  },
  async signup(parent, args, ctx, info) {
    // 1. lowercase email arg
    args.email = args.email.toLowerCase();
    // hash pass
    const password = await bcrypt.hash(args.password, 10);
    // create user in db
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ["USER"] }
        }
      },
      info
    );
    // create JWT token for user
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // Set jwt as cookie on response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // one year
    });
    // Return user to browser;
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // 1. Check if user exists with emailq
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No user found for ${email}`);
    }
    // 2. Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error(`Invalid Password!`);
    }
    // 3. Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. Set cookie with token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // one year
    });
    // 5. Return user
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Bye!" };
  },
  async requestReset(parent, { email }, ctx, info) {
    // 1. Check if real user
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) throw new Error(`No user found for ${email}`);
    // 2. Set reset token
    const promisifiedRandomBytes = promisify(randomBytes);
    const resetToken = (await promisifiedRandomBytes(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    const res = await ctx.db.mutation.updateUser({
      where: { email },
      data: { resetToken, resetTokenExpiry }
    });
    // 3. Email them the token
    const mailRes = await transport.sendMail({
      from: "nick@nick.com",
      to: email,
      subject: "Password Reset!",
      html: makeANiceEmail(
        `Your token is here! \n\n <a href="${
          process.env.FRONTEND_URL
        }/reset?resetToken=${resetToken}">Reset My Password!</a>`
      )
    });

    return { message: "Thanks" };
  },
  async resetPassword(parent, args, ctx, info) {
    const { resetToken, confirmPassword } = args;
    // 1. Check if passwords match
    if (args.password !== confirmPassword)
      throw new Error(`Passwords must match!`);
    // 2. Check if legit reset token
    // 3. Check if expired
    const [user] = await ctx.db.query.users({
      where: { resetToken, resetTokenExpiry_gte: Date.now() - 3600000 }
    });
    if (!user) throw new Error(`Invalid token!`);

    // 4. Hash new pass
    const password = await bcrypt.hash(args.password, 10);
    // 5. Save new pass to user and remove old resetToken
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    // 6. Gen JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. JWT to user
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // 8. Return user
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    // 1. Check for logged in
    if (!ctx.request.userId) throw new Error("You must be logged in!");
    // 2. Query current user
    const currentUser = await ctx.db.query.user(
      { where: { id: ctx.request.userId } },
      info
    );
    // 3. Check if they have permissions
    hasPermission(currentUser, ["ADMIN", "PERMISSIONUPDATE"]);
    // 4. Update user
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions
          }
        },
        where: {
          id: args.userId
        }
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    // 1. Make sure signed in
    const { userId } = ctx.request;
    if (!userId) throw new Error("You must be signed in!");
    // 2. Query current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id }
      }
    });
    // 3. Check if item in cart - if so increment
    if (existingCartItem) {
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 }
        },
        info
      );
    }
    // 4. If not create fresh CartItem for user
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId }
          },
          item: {
            connect: { id: args.id }
          }
        }
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {
    // 1. Find cart item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: {
          id: args.id
        }
      },
      `{id, user { id }}`
    );
    // 1.5 Make sure we found an item
    if (!cartItem) throw new Error("No item found");
    // 2. make sure they own it
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error("Cheaters never prosper.");
    }
    // 3. delete that item
    return ctx.db.mutation.deleteCartItem(
      {
        where: {
          id: args.id
        }
      },
      info
    );
  }
};

module.exports = Mutations;
