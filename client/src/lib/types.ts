export interface CartItem {
  id: string;
  name: string;
  nameVi?: string;
  price: number;
  vatRate?: number;
  quantity: number;
  image?: string;
  customization?: {
    schemaId: string;
    selections: Record<string, string>;
  };
}

export interface ReservationForm {
  date: string;
  time: string;
  guests: number;
  name: string;
  email?: string; // Optional field
  phone: string;
  specialRequests: string;
}

export interface ContactForm {
  name: string;
  email: string;
  phone?: string; // Optional phone number
  subject: string;
  message: string;
}
