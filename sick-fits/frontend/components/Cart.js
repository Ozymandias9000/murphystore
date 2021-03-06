import React, { Component } from "react";
import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";
import { adopt } from "react-adopt";
import CartStyles from "./styles/CartStyles";
import Supreme from "./styles/Supreme";
import CloseButton from "./styles/CloseButton";
import SickButton from "./styles/SickButton";
import CartItem from "./CartItem";
import User from "./User";
import calcTotalPrice from "../lib/calcTotalPrice";
import formatMoney from "../lib/formatMoney";

const LOCAL_STATE_QUERY = gql`
  query {
    cartOpen @client
  }
`;

const TOGGLE_CART_MUTATION = gql`
  mutation {
    toggleCart @client
  }
`;

const Composed = adopt({
  user: ({ render }) => <User>{render}</User>,
  toggleCart: ({ render }) => (
    <Mutation mutation={TOGGLE_CART_MUTATION}>{render}</Mutation>
  ),
  localState: ({ render }) => <Query query={LOCAL_STATE_QUERY}>{render}</Query>
});

export default class Cart extends Component {
  render() {
    return (
      <Composed>
        {({ user, toggleCart, localState }) => {
          const { me } = user.data;
          if (!me) return null;
          return (
            <CartStyles open={localState.data.cartOpen}>
              <header>
                <CloseButton title="close" onClick={toggleCart}>
                  &times;
                </CloseButton>
                <Supreme>
                  {me.name}
                  's Cart
                </Supreme>
                <p>
                  You Have {me.cart.length} Item
                  {me.cart.length > 1 ? "s" : ""}
                </p>
              </header>
              <ul>
                {me.cart.map(cartItem => {
                  return (
                    <ul key={cartItem.id}>
                      <CartItem cartItem={cartItem} />
                    </ul>
                  );
                })}
              </ul>
              <footer>
                <p>{formatMoney(calcTotalPrice(me.cart))}</p>
                <SickButton>Checkout</SickButton>
              </footer>
            </CartStyles>
          );
        }}
      </Composed>
    );
  }
}
export { LOCAL_STATE_QUERY };
export { TOGGLE_CART_MUTATION };
