const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  Admin,
  Role,
  Permission,
  AdminRoles,
  RolePermissions,
} = require("../../models");

// Admin Login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ where: { username } });
  if (!admin) {
    return res.status(404).send("Admin not found");
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(401).send("Incorrect password");
  }

  const roles = await admin.getRoles();

  let permissions = [];
  for (let role of roles) {
    if (role.name === "SuperAdmin") {
      permissions = ["ALL"]; // Assuming 'ALL' means all permissions. Adjust as needed.
      break;
    } else {
      // Fetch permissions for each role from the database
      const rolePermissions = await role.getPermissions();
      permissions = [
        ...permissions,
        ...rolePermissions.map((perm) => perm.name),
      ];
    }
  }

  // Removing duplicates from permissions
  permissions = [...new Set(permissions)];

  const token = jwt.sign(
    { adminId: admin.id, roles: roles.map((role) => role.name), permissions },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.status(200).send({
    token,
    roles: roles.map((role) => role.name),
    permissions,
  });
};

// Sub-Admin Creation
exports.createSubAdmin = async (req, res) => {
  const { username, email, password, roles } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const subAdmin = await Admin.create({
    username,
    email,
    password: hashedPassword,
  });

  const rolesToAdd = await Role.findAll({ where: { name: roles } });
  await subAdmin.setRoles(rolesToAdd);

  res.status(201).send(subAdmin);
};

// Assign permissions to a specific role
exports.assignPermissionsToRole = async (req, res) => {
  const { roleName, permissions } = req.body;

  const role = await Role.findOne({ where: { name: roleName } });
  if (!role) {
    return res.status(404).send("Role not found");
  }

  const permissionsToAdd = await Permission.findAll({
    where: { name: permissions },
  });
  await role.setPermissions(permissionsToAdd);

  res.status(200).send({ message: "Permissions assigned successfully!" });
};
