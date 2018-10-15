import React, { Component } from "react";
import Items from "../components/Items";

export default class Home extends Component {
  render() {
    return <Items page={parseFloat(this.props.query.page) || 1} />;
  }
}
