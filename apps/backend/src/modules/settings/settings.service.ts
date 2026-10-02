export class SettingService {
    private static instance: SettingService

    private constructor() { }

    static getInstance(): SettingService {
        if (!SettingService.instance) {
            SettingService.instance = new SettingService()
        }
        return SettingService.instance
    }

}

export const settingService = SettingService.getInstance();