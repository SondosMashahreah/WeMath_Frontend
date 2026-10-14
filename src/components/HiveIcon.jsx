import {
  FaRobot, FaScrewdriverWrench, FaUserGraduate, FaChalkboardUser,
  FaPeopleRoof, FaUser, FaTrophy, FaSeedling, FaBookOpenReader, FaAtom,
} from "react-icons/fa6";

// To replace an icon, import another React Icon and change it in this map.
const ICONS = {
  assistant: FaRobot,
  workshops: FaScrewdriverWrench,
  students: FaUserGraduate,
  teachers: FaChalkboardUser,
  parents: FaPeopleRoof,
  guest: FaUser,
  competitions: FaTrophy,
  initiatives: FaSeedling,
  research: FaBookOpenReader,
  steam: FaAtom,
};

export default function HiveIcon({ name }) {
  const Icon = ICONS[name];
  return <Icon className="bee-cell-icon" aria-hidden="true" focusable="false" />;
}
