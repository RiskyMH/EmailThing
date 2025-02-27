export default function AuthPage() {
  return (
    <div>
      <h1>Login/Register :)</h1>
      <button onClick={() => {
        document.cookie = "test=true"
        window.location = '/'
      }}>
        [login as test]
      </button>
    </div>
  )
}
