import React, { Component } from "react";
import CreateItem from "../components/CreateItem";
import PleaseSignIn from "../components/PleaseSignIn";

export default class Sell extends Component {
  render() {
    return (
      <div>
        <PleaseSignIn>
          <CreateItem />
        </PleaseSignIn>
      </div>
    );
  }
}
