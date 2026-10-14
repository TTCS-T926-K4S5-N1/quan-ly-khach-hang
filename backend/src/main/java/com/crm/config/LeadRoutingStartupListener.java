package com.crm.config;

import com.crm.service.routing.LeadRoutingDaemon;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

@WebListener
public class LeadRoutingStartupListener implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        LeadRoutingDaemon.getInstance().start();
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        LeadRoutingDaemon.getInstance().stop();
    }
}
