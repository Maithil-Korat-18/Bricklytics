import { 
  LayoutDashboard, 
  PlusCircle, 
  Building2, 
  LineChart, 
  Search,
  Heart,
  SlidersHorizontal,
  Calendar,
  User
} from 'lucide-react';
import { ROUTES } from '../constants/routes';

export const sellerNavigationConfig = [
  {
    title: 'Seller Dashboard',
    path: ROUTES.SELLER_DASHBOARD,
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: 'Add Property',
    path: ROUTES.ADD_PROPERTY,
    icon: PlusCircle,
    exact: false,
  },
  {
    title: 'Manage Properties',
    path: ROUTES.MANAGE_PROPERTIES,
    icon: Building2,
    exact: false,
  },
  {
    title: 'Analytics',
    path: ROUTES.ANALYTICS,
    icon: LineChart,
    exact: false,
  },
];

export const buyerNavigationConfig = [
  {
    title: 'Buyer Dashboard',
    path: ROUTES.BUYER_DASHBOARD,
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: 'Explore Properties',
    path: ROUTES.PROPERTIES,
    icon: Search,
    exact: false,
  },
  {
    title: 'My Wishlist',
    path: ROUTES.WISHLIST,
    icon: Heart,
    exact: false,
  },
  {
    title: 'Compare Properties',
    path: ROUTES.COMPARE,
    icon: SlidersHorizontal,
    exact: false,
  },
  {
    title: 'Inquiry & Site Visit',
    path: ROUTES.SCHEDULE_VISIT,
    icon: Calendar,
    exact: false,
  },

  {
    title: 'My Profile',
    path: ROUTES.BUYER_PROFILE,
    icon: User,
    exact: false,
  },
];

export const getNavigationForRole = (role) => {
  return role === 'seller' ? sellerNavigationConfig : buyerNavigationConfig;
};
