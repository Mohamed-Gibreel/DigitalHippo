import { Product, User } from "../../payload-types";
import { PRODUCT_CATEGORIES } from "../../config";
import { Access, CollectionConfig } from "payload/types";
import { BeforeChangeHook } from "payload/dist/collections/config/types";
import { stripe } from "../../lib/stripe";

const addUser: BeforeChangeHook<Product> = ({ req, data }) => {
  const user = req.user as User | null;
  return {
    ...data,
    user: user?.id,
  };
};

const isAdminOrHasAccessToProduct =
  (): Access =>
  async ({ req }) => {
    const user = req.user as User;
    if (!user) return false;
    if (user.role === "admin") return true;
    return {
      user: {
        equals: req.user.id,
      },
    };
  };

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
  },
  access: {
    read: async ({ req }) => {
      const referer = req.headers.referer;
      if (!req.user || !referer?.includes("sell")) {
        return true;
      }
      return await isAdminOrHasAccessToProduct()({ req });
    },
    delete: isAdminOrHasAccessToProduct(),
    update: isAdminOrHasAccessToProduct(),
  },
  hooks: {
    beforeChange: [
      addUser,
      async (args) => {
        if (args.operation === "create") {
          const product = args.data as Product;
          const stripeProduct = await stripe.products.create({
            name: product.name,
            default_price_data: {
              currency: "AED",
              // We multiple by 100 because unit_amount accepts price in cents.
              unit_amount: Math.round(product.price * 100),
            },
          });
          const updatedProduct: Product = {
            ...product,
            stripeId: stripeProduct.id,
            priceId: stripeProduct.default_price as string,
          };

          return updatedProduct;
        } else if (args.operation === "update") {
          const product = args.data as Product;
          const stripeProduct = await stripe.products.update(product.stripeId!, {
            name: product.id,
            default_price: product.priceId!,
          });
          const updatedProduct: Product = {
            ...product,
            stripeId: stripeProduct.id,
            priceId: stripeProduct.default_price as string,
          };

          return updatedProduct;
        }
      },
    ],
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      hasMany: false,
      admin: {
        hidden: true,
      },
    },
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Product details",
      type: "textarea",
    },
    {
      name: "price",
      label: "Price in AED",
      min: 0,
      max: 1000,
      type: "number",
      required: true,
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: PRODUCT_CATEGORIES.map(({ label, value }) => ({ label, value })),
      required: true,
    },
    {
      name: "product_files",
      label: "Product file(s)",
      type: "relationship",
      relationTo: "product_files",
      required: true,
      hasMany: false,
    },
    {
      name: "approvedForSale",
      label: "Product Status",
      type: "select",
      access: {
        create: ({ req }) => {
          return req.user.role === "admin";
        },
        read: ({ req }) => {
          return req.user.role === "admin";
        },
        update: ({ req }) => {
          return req.user.role === "admin";
        },
      },
      defaultValue: "pending",
      options: [
        {
          label: "Pending Verification",
          value: "pending",
        },
        {
          label: "Approved",
          value: "approved",
        },
        {
          label: "Denied",
          value: "denied",
        },
      ],
    },
    {
      name: "priceId",
      type: "text",
      admin: {
        hidden: true,
      },
      access: {
        create: () => false,
        read: () => false,
        update: () => false,
      },
    },
    {
      name: "stripeId",
      type: "text",
      admin: {
        hidden: true,
      },
      access: {
        create: () => false,
        read: () => false,
        update: () => false,
      },
    },
    {
      name: "images",
      type: "array",
      label: "Product Images",
      minRows: 1,
      maxRows: 4,
      required: true,
      labels: {
        singular: "Product Image",
        plural: "Product Images",
      },
      fields: [
        {
          name: "image",
          label: "Image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
  ],
};
