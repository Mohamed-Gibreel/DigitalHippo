"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/use-cart";
import { Product } from "@/payload-types";

type Props = {
  product: Product;
};

const AddToCartButton = ({ product }: Props) => {
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(product);
    setIsSuccess(true);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsSuccess(false);
    }, 2000);
    return () => {
      clearTimeout(timeout);
    };
  }, [isSuccess]);

  return (
    <Button onClick={handleAddToCart} size="lg" className="w-full">
      {isSuccess ? "Added!" : "Add To Cart"}
    </Button>
  );
};

export default AddToCartButton;
