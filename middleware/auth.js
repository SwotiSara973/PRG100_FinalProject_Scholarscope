import jwt from "jsonwebtoken";

// usage: auth() for any logged-in user
//        auth(["admin"]) for admin-only
export function auth(roles = null) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token =
        (header.startsWith("Bearer ") && header.split(" ")[1]) ||
        (req.cookies && req.cookies.token);
      if (!token) return res.status(401).json({ message: "Not authenticated" });

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;

      if (roles) {
        const allowed = Array.isArray(roles) ? roles : [roles];
        if (!allowed.includes(req.user.role))
          return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}
