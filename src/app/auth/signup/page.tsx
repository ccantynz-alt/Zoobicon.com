/**
 * Stub /auth/signup — same honesty story as /auth/login. Vapron SSO
 * will own the real signup flow; until then we send users straight to
 * the product so they're not stuck at a 404.
 */

import LoginStub from "../login/page";

export default function SignupStub() {
  return <LoginStub />;
}
