export type AttendanceDTO = {
  checkIn: null | string;
  checkOut: null | string;
  createdAt: string;
  id: number;
  latitude: number;
  longitude: number;
  site: { id: number; name: null | string } | null;
  status: null | string; // ajusta a tu enum
  updatedAt: string;
  user: {
    firstName: null | string;
    id: number;
    image: null | string;
    lastName: null | string;
  } | null;
};
