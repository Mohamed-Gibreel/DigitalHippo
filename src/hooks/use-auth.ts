import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useAuth = () => {
  const router = useRouter();

  const signOut = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/logout`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) throw new Error();
      toast.success("Signed out succesfully.");
      // router.push("/");
      router.refresh();
    } catch (err) {
      toast.error("Unable to sign out. Please try again.");
    }
  };

  return { signOut };
};
