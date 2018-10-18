import { Query } from "react-apollo";
import Signin from "./Signin";
import { CURRENT_USER_QUERY } from "./User";

export default function PleaseSignIn(props) {
  return (
    <Query query={CURRENT_USER_QUERY}>
      {({ data, loading }) => {
        if (loading) return <p>Loading...</p>;
        if (!data.me) {
          return (
            <div>
              <p>Please Sign In!</p>
              <Signin />
            </div>
          );
        }
        return props.children;
      }}
    </Query>
  );
}
