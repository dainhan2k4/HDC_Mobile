FROM odoo:18
USER root
COPY ./addons /mnt/extra-addons
COPY ./etc/odoo.conf /etc/odoo/odoo.conf
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh

# Give execute permissions to the entrypoint script
RUN chmod +x /usr/local/bin/entrypoint.sh

# Give ownership of the /etc/odoo directory to the odoo user
RUN chown -R odoo:odoo /etc/odoo

USER odoo
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]