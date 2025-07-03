import { Context } from "elysia";
import { auth } from "./auth";

const betterAuthView = async (context: Context) => {
  const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"]
  await new Promise(res => setTimeout(res, 1000))
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    // console.log(context.request)
    return auth.handler(context.request);
  }
  else {
    context.status(405)
  }
}

export default betterAuthView;