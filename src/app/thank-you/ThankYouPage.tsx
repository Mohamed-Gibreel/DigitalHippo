import { getServerSideUser } from "@/lib/payload-utils";
import Image from "next/image";
import React from "react";
import { cookies } from "next/headers";
import { getPayloadClient } from "@/get-payload";
import { notFound, redirect } from "next/navigation";
import { Props } from "./page";

export const ThankYouPage = async ({ searchParams }: Props) => {
  const { orderId } = searchParams;
  const nextCookies = cookies();

  const { user } = await getServerSideUser(nextCookies);

  const payload = await getPayloadClient();
  const { docs: orders } = await payload.find({
    collection: "orders",
    depth: 2,
    where: {
      id: {
        equals: orderId,
      },
    },
  });

  const [order] = orders;

  if (!order) {
    return notFound();
  }

  const orderUserId = typeof order.user === "string" ? order.user : order.user.id;

  if (orderUserId != user?.id) {
    // TODO:
    //
    // Redirect to sign in only if user is not logged in, if user is already logged in and
    // userId is not the same as orderUserId then show an unauthorized message showing that
    // the order was not created by them.
    return redirect(`/sign-in?origin=thank-you?orderId=${order.id}`);
  }

  return (
    <main className="relative lg:min-h-full">
      <div className="hidden lg:block h-80 overflow-hidden lg:absolute lg:h-full lg:w-1/2 lg:pr-4 xl:pr-12">
        <Image
          fill
          alt="Thank you for your order"
          src="/checkout-thank-you.jpg"
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div>
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-32 xl:gap-x-24">
          <div className="lg:col-start-2">
            <p className="text-sm font-medium text-blue-600">Order successfull</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Thanks for ordering
            </h1>
          </div>
        </div>
      </div>
    </main>
  );
};
