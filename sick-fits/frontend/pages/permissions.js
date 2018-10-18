import React, { Component } from "react";
import PleaseSignIn from "../components/PleaseSignIn";
import Permissions from "../components/Permissions";

export default class PermissionsPage extends Component {
  render() {
    return (
      <div>
        <PleaseSignIn>
          <Permissions />
        </PleaseSignIn>
      </div>
    );
  }
}
