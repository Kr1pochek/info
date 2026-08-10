import {
  BadgeCheck, BadgePercent, BriefcaseBusiness, Building2, Calculator, CalendarCheck, CalendarClock,
  CalendarDays, CalendarX, Car, CircleDollarSign, ClipboardList, Clock3, Container, FileBadge,
  FileSpreadsheet, FileText, Files, Folder, Headphones, Home, Landmark, ListChecks, Luggage,
  Accessibility, Award, Baby, MapPinned, MessagesSquare, MonitorCog, Package, ReceiptText, Rocket,
  Scale, TrendingUp, Undo2, Users, WalletCards,
} from 'lucide-react';

const icons = {
  BadgeCheck, BadgePercent, BriefcaseBusiness, Building2, Calculator, CalendarCheck, CalendarClock,
  CalendarDays, CalendarX, Car, CircleDollarSign, ClipboardList, Clock3, Container, FileBadge,
  FileSpreadsheet, FileText, Files, Folder, Headphones, Home, Landmark, ListChecks, Luggage,
  Accessibility, Award, Baby, MapPinned, MessagesSquare, MonitorCog, Package, ReceiptCheck: ReceiptText,
  ReceiptText, Rocket, Scale, TrendingUp, Undo2, Users, WalletCards,
};

export default function AppIcon({ name, size = 28, ...props }) {
  const Icon = icons[name] || FileText;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" {...props} />;
}
