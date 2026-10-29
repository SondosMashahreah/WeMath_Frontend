import {
  FaRobot, FaScrewdriverWrench, FaUserGraduate, FaChalkboardUser,
  FaPeopleRoof, FaTrophy, FaSeedling,
} from "react-icons/fa6";

const BRAND_LOGOS = { research: "/brands/parp.png", steam: "/brands/we-steam.png" };
const ICONS = {
  assistant: FaRobot, workshops: FaScrewdriverWrench, students: FaUserGraduate,
  teachers: FaChalkboardUser, parents: FaPeopleRoof, competitions: FaTrophy, initiatives: FaSeedling,
};

export default function HiveIcon({ name }) {
  if (BRAND_LOGOS[name]) return <img className="bee-cell-icon bee-cell-brand-logo" src={BRAND_LOGOS[name]} alt="" aria-hidden="true" />;
  const Icon = ICONS[name];
  return Icon ? <Icon className="bee-cell-icon" aria-hidden="true" focusable="false" /> : null;
}
