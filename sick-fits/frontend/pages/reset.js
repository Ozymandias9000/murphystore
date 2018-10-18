import React from "react";
import Reset from "../components/Reset";

export default function reset(props) {
  return (
    <div>
      <Reset resetToken={props.query.resetToken} />
    </div>
  );
}
