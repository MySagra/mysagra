import { registerModules } from "@/core/http";

import { authModule } from "@/modules/auth/auth.route";
import { eventsModule } from "@/modules/events/events.route";
import { cashRegistersModule } from "@/modules/cash-registers/cash-registers.route";
import { categoriesModule } from "@/modules/categories/categories.route";
import { foodsModule } from "@/modules/foods/foods.routes";
import { ingredientsModule } from "@/modules/ingredients/ingredients.route";
import { ordersModule } from "@/modules/orders/orders.route";
import { printersModule } from "@/modules/printers/printers.route";
import { rolesModule } from "@/modules/roles/roles.route";
import { usersModule } from "@/modules/users/users.route";
import { apiKeysModule } from "@/modules/api-keys/api-keys.route";
import { bannerModule } from "@/modules/banner/banner.route";
import { reportModule } from "@/modules/report/report.route";
import { orderInstructionsModule } from "@/modules/order-instructions/order-instruction.route";
import { stationsModule } from "@/modules/station/stations.route";

export default registerModules([
    authModule,
    eventsModule,
    cashRegistersModule,
    categoriesModule,
    foodsModule,
    ingredientsModule,
    ordersModule,
    printersModule,
    rolesModule,
    usersModule,
    apiKeysModule,
    bannerModule,
    reportModule,
    orderInstructionsModule,
    stationsModule,
]);
