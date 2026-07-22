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
        onSuccess={(credentialResponse) => {
          console.log("Google Login Success:", credentialResponse);
        }}
        onError={() => {
          console.log("Login Failed");
        }}
      />
    </div>
  );
}

export default App;