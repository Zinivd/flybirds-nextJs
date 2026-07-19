const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://backend-dev.flybirdsleggings.com/api";

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

// app/lib/api.ts (additions)

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
