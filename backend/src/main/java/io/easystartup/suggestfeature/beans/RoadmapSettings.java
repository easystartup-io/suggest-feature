package io.easystartup.suggestfeature.beans;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/*
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class RoadmapSettings {

    private boolean enabled = true;
    private List<String> disabledBoards;
    private List<StatusConfig> statusConfigs;

    public RoadmapSettings() {
    }

    public List<String> getDisabledBoards() {
        return disabledBoards;
    }

    public void setDisabledBoards(List<String> disabledBoards) {
        this.disabledBoards = disabledBoards;
    }

    public List<StatusConfig> getStatusConfigs() {
        return statusConfigs;
    }

    public void setStatusConfigs(List<StatusConfig> statusConfigs) {
        this.statusConfigs = statusConfigs;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
