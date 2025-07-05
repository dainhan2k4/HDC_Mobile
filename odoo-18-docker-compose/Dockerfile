FROM odoo:18
USER root
COPY ./addons /mnt/extra-addons
COPY ./etc/odoo.conf /etc/odoo/odoo.conf

# Give ownership of the /etc/odoo directory to the odoo user
RUN chown -R odoo:odoo /etc/odoo

USER odoo