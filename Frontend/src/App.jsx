import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

function App() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: "20px",
      }}
    >
      <h1>LinkUp</h1>

      <GoogleLogin
      onSuccess={async (credentialResponse) => {
        try {
          const response = await axios.post(
            "http://localhost:8000/api/v1/users/google-login",
            {
              idToken: credentialResponse.credential,
            },
            {
              withCredentials: true,
            }
          );

          console.log(response.data);
        } catch (error) {
          console.error(error);
        }
      }}
      onError={() => {
        console.error("Login Failed");
      }}
      />
    </div>
  );
}

export default App;