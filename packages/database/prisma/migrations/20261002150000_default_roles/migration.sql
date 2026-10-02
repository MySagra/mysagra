/*
  Default roles. They are referenced by name in the code (authenticate([...])),
  so they must exist in every environment, not only where a seed was run.

  INSERT IGNORE relies on the unique roles.name: installations that already
  have these roles (created by the old seed) keep them with their ids.
  Ids start with "c" because roleId is validated as a cuid by the API schemas.
*/

INSERT IGNORE INTO `roles` (`id`, `name`) VALUES
    ('cmgrole0admin000000000001', 'admin'),
    ('cmgrole0maint000000000002', 'maintainer'),
    ('cmgrole0opera000000000003', 'operator');
