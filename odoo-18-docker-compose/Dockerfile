FROM odoo:18
USER root

# System deps needed for proper PDF/font rendering and ReportLab base fonts
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       fonts-dejavu-core \
       fontconfig \
       gsfonts \
    && rm -rf /var/lib/apt/lists/*

# Reduce pip root-user noise if any build-time installations occur
ENV PIP_ROOT_USER_ACTION=ignore \
    PIP_DISABLE_PIP_VERSION_CHECK=1

COPY ./addons /mnt/extra-addons
COPY ./etc/odoo.conf /etc/odoo/odoo.conf
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh

# Give execute permissions to the entrypoint script
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && sed -i 's/\r$//' /usr/local/bin/entrypoint.sh

# Give ownership of the /etc/odoo directory to the odoo user
RUN chown -R odoo:odoo /etc/odoo

USER odoo
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]