import type { Metadata } from "next";
import Cover from "../../components/sections/cover";
import User from "../../components/sections/user";
import Settings from "../../components/sections/settings";
import Content from "../../components/layouts/content";
import useAuth from "../../hooks/use-auth";

export const metadata: Metadata = {
  title: "Profile",
};

const Page = async () => {
  const { session } = await useAuth();

  return (
    <>
      <Cover company="disney-plus" />
      <Content variant="secondary">
        {/* @ts-ignore */}
        <User />
        <Settings
          name={session?.user?.name}
          email={session?.user?.email}
          provider={(session as any)?.provider}
        />
      </Content>
    </>
  );
};

export default Page;
