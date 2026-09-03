// export const API_URL = "http://127.0.0.1:8000/api";
// export const API_URL = "https://api-prod.flybirdsleggings.com/api";
export const API_URL = "https://backend-dev.flybirdsleggings.com/api";

// ---------- Delhivery Tracking (customer-facing) ----------
interface TrackOrderResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    order_id: string;
    shipment_status?: string; // "not_shipped" when no AWB yet
    message?: string;
    awb_number?: string;
    delivery_status?: string;
  };
}

function getHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function getCategoryList<T>(): Promise<T> {
  const res = await fetch(`${API_URL}/admin/categories`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Get Category List API error");
  return res.json();
}

export async function getBanners<T>(): Promise<T> {
  const res = await fetch(`${API_URL}/banners`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Get Banners API error");
  return res.json();
}

export async function getBestSellers<T>(): Promise<T> {
  const res = await fetch(`${API_URL}/admin/home/best-sellers`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Get Best Sellers API error");
  return res.json();
}

export async function getCollections<T>(): Promise<T> {
  const res = await fetch(`${API_URL}/admin/home/best-collections`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Get Collections API error");
  return res.json();
}

export async function getReelList<T>(): Promise<T> {
  const res = await fetch(`${API_URL}/admin/video-reels?is_published=true`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Get Reel List API error");
  return res.json();
}

export async function getTestimonials<T>(): Promise<T> {
  const res = await fetch(`${API_URL}/reviews`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Get Testimonials API error");
  return res.json();
}

export async function addToCart<T>(userId: string, payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/admin/users/${userId}/cart`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Add To Cart API error");
  return res.json();
}

export async function loginOtp<T>(payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function loginwithEmail<T>(payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function loginOtpVerify<T>(payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function register<T>(payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/auth/register/init`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function verifyOtp<T>(payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/auth/register/verify`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getUserInfo<T>(userId: string): Promise<T> {
  const res = await fetch(`${API_URL}/auth/user/info/${userId}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function updateProfile<T>(
  userId: string,
  payload: any,
): Promise<T> {
  const res = await fetch(`${API_URL}/auth/profile/update/${userId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function sendPasswordOtp<T>(payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/auth/forgot-password/send-otp`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function verifyPasswordOtp<T>(payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/auth/forgot-password/verify-otp`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getOrdersByUser<T>(userId: string): Promise<T> {
  const res = await fetch(`${API_URL}/users/${userId}/orders`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getOrderById<T>(orderId: string | number): Promise<T> {
  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getWishlist<T>(userId: string): Promise<T> {
  const res = await fetch(`${API_URL}/admin/users/${userId}/wishlist`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function removeFromWishlist<T>(
  userId: string,
  productId: string | number,
): Promise<T> {
  const res = await fetch(
    `${API_URL}/admin/users/${userId}/wishlist/product/${productId}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    },
  );
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getAddresses<T>(userId: string): Promise<T> {
  const res = await fetch(`${API_URL}/admin/users/${userId}/addresses`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function addAddress<T>(userId: string, payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/admin/users/${userId}/addresses`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function updateAddress<T>(
  userId: string,
  addressId: string | number,
  payload: any,
): Promise<T> {
  const res = await fetch(
    `${API_URL}/admin/users/${userId}/addresses/${addressId}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    },
  );
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function deleteAddress<T>(
  userId: string,
  addressId: string | number,
): Promise<T> {
  const res = await fetch(
    `${API_URL}/admin/users/${userId}/addresses/${addressId}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    },
  );
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getColors<T>(): Promise<T> {
  const res = await fetch(`${API_URL}/admin/attributes/colors`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getProducts<T>(params: Record<string, any>): Promise<T> {
  const query = new URLSearchParams(
    Object.entries(params).reduce(
      (acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== "") acc[k] = String(v);
        return acc;
      },
      {} as Record<string, string>,
    ),
  ).toString();
  const res = await fetch(`${API_URL}/admin/products?${query}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getProductById<T>(id: number): Promise<T> {
  const res = await fetch(`${API_URL}/admin/products/${id}?id=${id}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getSimilarProducts<T>(
  productId: number | string,
): Promise<T> {
  const res = await fetch(`${API_URL}/admin/products/${productId}/similar`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getReviewsByProduct<T>(
  productId: number | string,
): Promise<T> {
  const res = await fetch(`${API_URL}/products/${productId}/reviews`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function createReview<T>(payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/reviews`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function addToWishlist<T>(
  userId: string,
  payload: any,
): Promise<T> {
  const res = await fetch(`${API_URL}/admin/users/${userId}/wishlist`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function addRecentlyViewed<T>(payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/recently-viewed`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getCart<T>(userId: string): Promise<T> {
  const res = await fetch(`${API_URL}/admin/users/${userId}/cart`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function updateCartItem<T>(
  userId: string,
  cartId: number,
  payload: any,
): Promise<T> {
  const res = await fetch(`${API_URL}/admin/users/${userId}/cart/${cartId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function removeCartItem<T>(
  userId: string,
  cartId: number,
): Promise<T> {
  const res = await fetch(`${API_URL}/admin/users/${userId}/cart/${cartId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getRecentlyViewed<T>(userId: string): Promise<T> {
  const res = await fetch(`${API_URL}/recently-viewed/${userId}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

// ---------- Orders / Payment (added for checkout → payment → review flow) ----------

export async function createOrder<T>(payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/orders/checkout`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function verifyPayment<T>(payload: any): Promise<T> {
  const res = await fetch(`${API_URL}/payment/verify`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function sentMail<T>(orderId: string | number): Promise<T> {
  const res = await fetch(`${API_URL}/orders/${orderId}/invoice-mail`, {
    method: "POST",
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function checkPincodeAvailability<T>(pincode: string): Promise<T> {
  const res = await fetch(
    `${API_URL}/user/delhivery/serviceability/${pincode}`,
    {
      method: "GET",
      headers: getHeaders(),
    },
  );
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getShippingCharges<T>(
  destinationPincode: string,
  weightGrams: number,
  paymentMode: "COD" | "Prepaid" = "Prepaid",
  codAmount: number = 0,
): Promise<T> {
  const originPin = "641603"; // your warehouse/pickup pincode — consider pulling from config/env instead of hardcoding here
  const params = new URLSearchParams({
    origin_pin: originPin,
    destination_pin: destinationPincode,
    weight: String(weightGrams),
    payment_mode: paymentMode,
    cod_amount: String(codAmount),
  });
  const res = await fetch(
    `${API_URL}/user/delhivery/shipping-cost?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
    },
  );
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

/**
 * Confirms an order as Cash on Delivery — the COD counterpart to `verifyPayment`.
 * Follows the same `/orders/{orderId}/...` pattern as `sentMail`.
 * NOTE: rename/adjust the path if your backend exposes a different route for this.
 */
/**
 * Confirms an order as Cash on Delivery.
 * The backend (OrderController::confirmCod) recomputes the amount and
 * shipping charge itself from the order's frozen subtotal/discount/tax —
 * it never trusts client-supplied money values, so no payload is sent.
 */
export async function getShippingQuote<T>(
  orderId: string | number,
  paymentMethod: "cod" | "razorpay",
): Promise<T> {
  const res = await fetch(
    `${API_URL}/orders/${orderId}/shipping-quote?payment_method=${paymentMethod}`,
    { headers: getHeaders() },
  );
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function confirmCodOrder<T>(orderId: string | number): Promise<T> {
  const res = await fetch(`${API_URL}/orders/${orderId}/cod-confirm`, {
    method: "POST",
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function trackOrder<T = TrackOrderResponse>(
  orderId: string,
  userId: string,
): Promise<T> {
  const res = await fetch(
    `${API_URL}/user/delhivery/track/${orderId}/${userId}`,
    { headers: getHeaders() },
  );
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

export async function getSpotlights<T>(): Promise<T> {
  const res = await fetch(`${API_URL}/spotlights`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Get Spotlights API error");
  return res.json();
}

// Blogs
// GET /blogs -> { status, message, data: { data: BlogItem[], ... (paginated) } }
export async function getBlogs<T>(): Promise<T> {
  const res = await fetch(`${API_URL}/blogs`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Get Blogs API error");
  return res.json();
}

// GET /blogs/{id} -> { status, message, data: BlogItem }
export async function getBlogById<T>(id: number | string): Promise<T> {
  const res = await fetch(`${API_URL}/blogs/${id}`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}

// GET wishlist and cart count
export async function getCartWishlistSummary<T>(userId: string): Promise<T> {
  const res = await fetch(
    `${API_URL}/admin/users/${userId}/cart-wishlist-summary`,
    {
      headers: getHeaders(),
    },
  );
  const data = await res.json();
  if (!res.ok) throw { error: data };
  return data;
}
