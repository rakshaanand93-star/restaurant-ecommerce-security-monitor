import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlistItem {
  productId?: string;
  restaurantId?: string;
  name: string;
  image?: string;
  price?: number; // mainly for products
  cuisine?: string; // mainly for restaurants
}

export interface IWishlist extends Document {
  customerId: string;
  company: string; // 'amazon' or 'zomato'
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistItemSchema = new Schema<IWishlistItem>({
  productId: { type: String },
  restaurantId: { type: String },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number },
  cuisine: { type: String },
});

const wishlistSchema = new Schema<IWishlist>(
  {
    customerId: { type: String, required: true },
    company: { type: String, required: true },
    items: [wishlistItemSchema],
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: 'wishlists' }
);

export const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);
export default Wishlist;
