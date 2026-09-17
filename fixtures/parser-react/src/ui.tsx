import { useState } from "react";

export function Button() {
  return <button>Click</button>;
}

export const WelcomeCard = () => {
  return <section>Welcome</section>;
};

export function useCounter() {
  const [count, setCount] = useState(0);

  return {
    count,
    setCount,
  };
}

function UserService() {
  return createUserService();
}

function ParseJSON() {
  return JSON.parse("{}");
}

function createUserService() {
  return { ok: true };
}
