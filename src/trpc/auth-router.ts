import { getPayloadClient } from "../get-payload";
import { publicProcedure, router } from "./trpc";
import { AuthCredentialsValidator } from "../lib/validators/account-credentials";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  getFakeData: publicProcedure.query(() => {
    return "Hello World";
  }),
  createPayloadUser: publicProcedure.input(AuthCredentialsValidator).mutation(async ({ input }) => {
    const { email, password } = input;
    const payload = await getPayloadClient();
    // Check if user already exists
    const { docs: users } = await payload.find({
      collection: "users",
      where: {
        email: {
          equals: email,
        },
      },
    });

    if (users.length !== 0) throw new TRPCError({ code: "CONFLICT" });

    await payload.create({
      collection: "users",
      data: {
        email: email,
        password: password,
        role: "user",
      },
    });
    return { success: true, sentToEmail: email };
  }),
});
