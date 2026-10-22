import Image from "next/image";
import useAuth from "../../../hooks/use-auth";
import SignOut from "./sign-out";

const User = async () => {
  const { session } = await useAuth();

  return (
    <section className="grid items-center gap-4 tablet:grid-cols-[1fr,auto] tablet:pr-6">
      <div className="flex items-center gap-4">
        <div className="relative flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-action-dark">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session?.user?.name ?? ""}
              fill
              priority
              sizes="100px"
              className="object-cover"
            />
          ) : (
            <span className="font-semibold">
              {session?.user?.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <div>
          <strong className="tablet:text-2xl">{session?.user?.name}</strong>
          <p className="text-xs">{session?.user?.email}</p>
        </div>
      </div>
      <SignOut />
    </section>
  );
};

export default User;
