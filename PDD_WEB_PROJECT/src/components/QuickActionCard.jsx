import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/AuthContext";

export default function QuickActionCard({ icon: Icon, title, description, to, color }) {
  const navigate = useNavigate();
  const { isAuthenticated, navigateToLogin } = useAuth();

  const publicRoutes = ['/departments', '/police-stations', '/constitution-rights', '/contact'];
  const isProtected = !publicRoutes.includes(to);

  const handleClick = (e) => {
    e.preventDefault();
    if (isProtected && !isAuthenticated) {
      sessionStorage.setItem('auth_return_to', to);
      navigateToLogin();
    } else {
      navigate(to);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={handleClick}
      className="cursor-pointer"
    >
      <div className="block bg-card rounded-xl border border-border p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-primary/30 transition-all duration-300 group">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}