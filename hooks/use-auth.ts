import { getServerSession } from "next-auth";
import { authOptions } from "../pages/api/auth/[...nextauth]";

const useAuth = async () => {
  const session = await getServerSession(authOptions);
  return { session };
};

export default useAuth;
