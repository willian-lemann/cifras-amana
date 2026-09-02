import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

import { useEffect } from "react";

export const useRequireAuth = () => {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
