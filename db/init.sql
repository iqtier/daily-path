CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010044905_AddGoals') THEN
    CREATE TABLE "Goals" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Title" character varying(200) NOT NULL,
        "Details" text,
        "Category" text NOT NULL,
        "Status" text NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Goals" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010044905_AddGoals') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261010044905_AddGoals', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010160752_AddFutureTasks') THEN
    CREATE TABLE "FutureTasks" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Title" character varying(200) NOT NULL,
        "Type" text NOT NULL,
        "DueDate" date NOT NULL,
        "Weight" numeric(5,2),
        "Size" text,
        "EstimatedHours" numeric(6,2),
        "EstimateSource" text,
        "Materials" character varying(4000),
        "Status" text NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "CompletedAt" timestamp with time zone,
        CONSTRAINT "PK_FutureTasks" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010160752_AddFutureTasks') THEN
    CREATE INDEX "IX_FutureTasks_UserId_Status_DueDate" ON "FutureTasks" ("UserId", "Status", "DueDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010160752_AddFutureTasks') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261010160752_AddFutureTasks', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010165844_AddDailyPlans') THEN
    CREATE TABLE "DailyPlans" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Date" date NOT NULL,
        "HoursAvailable" numeric(4,2) NOT NULL,
        "BonusRequestCount" integer NOT NULL,
        "GeneratedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DailyPlans" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010165844_AddDailyPlans') THEN
    CREATE TABLE "DailyTasks" (
        "Id" uuid NOT NULL,
        "DailyPlanId" uuid NOT NULL,
        "Order" integer NOT NULL,
        "Title" character varying(200) NOT NULL,
        "Description" character varying(1000) NOT NULL,
        "Reason" character varying(500) NOT NULL,
        "EstimatedMinutes" integer NOT NULL,
        "StartedAt" timestamp with time zone,
        "TimeSpentSeconds" integer,
        "IsCompleted" boolean NOT NULL,
        "CompletedAt" timestamp with time zone,
        "IsBonus" boolean NOT NULL,
        "GoalId" uuid,
        "FutureTaskId" uuid,
        CONSTRAINT "PK_DailyTasks" PRIMARY KEY ("Id"),
        CONSTRAINT "CK_DailyTask_SingleLink" CHECK (("GoalId" IS NULL) <> ("FutureTaskId" IS NULL)),
        CONSTRAINT "FK_DailyTasks_DailyPlans_DailyPlanId" FOREIGN KEY ("DailyPlanId") REFERENCES "DailyPlans" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_DailyTasks_FutureTasks_FutureTaskId" FOREIGN KEY ("FutureTaskId") REFERENCES "FutureTasks" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_DailyTasks_Goals_GoalId" FOREIGN KEY ("GoalId") REFERENCES "Goals" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010165844_AddDailyPlans') THEN
    CREATE UNIQUE INDEX "IX_DailyPlans_UserId_Date" ON "DailyPlans" ("UserId", "Date");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010165844_AddDailyPlans') THEN
    CREATE UNIQUE INDEX "IX_DailyTasks_DailyPlanId_Order" ON "DailyTasks" ("DailyPlanId", "Order");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010165844_AddDailyPlans') THEN
    CREATE INDEX "IX_DailyTasks_FutureTaskId" ON "DailyTasks" ("FutureTaskId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010165844_AddDailyPlans') THEN
    CREATE INDEX "IX_DailyTasks_GoalId" ON "DailyTasks" ("GoalId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010165844_AddDailyPlans') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261010165844_AddDailyPlans', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE TABLE "AspNetRoles" (
        "Id" uuid NOT NULL,
        "Name" character varying(256),
        "NormalizedName" character varying(256),
        "ConcurrencyStamp" text,
        CONSTRAINT "PK_AspNetRoles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE TABLE "AspNetUsers" (
        "Id" uuid NOT NULL,
        "TimeZoneId" character varying(64) NOT NULL,
        "DefaultHoursPerDay" numeric(4,2) NOT NULL,
        "UserName" character varying(256),
        "NormalizedUserName" character varying(256),
        "Email" character varying(256),
        "NormalizedEmail" character varying(256),
        "EmailConfirmed" boolean NOT NULL,
        "PasswordHash" text,
        "SecurityStamp" text,
        "ConcurrencyStamp" text,
        "PhoneNumber" text,
        "PhoneNumberConfirmed" boolean NOT NULL,
        "TwoFactorEnabled" boolean NOT NULL,
        "LockoutEnd" timestamp with time zone,
        "LockoutEnabled" boolean NOT NULL,
        "AccessFailedCount" integer NOT NULL,
        CONSTRAINT "PK_AspNetUsers" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE TABLE "AspNetRoleClaims" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "RoleId" uuid NOT NULL,
        "ClaimType" text,
        "ClaimValue" text,
        CONSTRAINT "PK_AspNetRoleClaims" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_AspNetRoleClaims_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE TABLE "AspNetUserClaims" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "UserId" uuid NOT NULL,
        "ClaimType" text,
        "ClaimValue" text,
        CONSTRAINT "PK_AspNetUserClaims" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_AspNetUserClaims_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE TABLE "AspNetUserLogins" (
        "LoginProvider" text NOT NULL,
        "ProviderKey" text NOT NULL,
        "ProviderDisplayName" text,
        "UserId" uuid NOT NULL,
        CONSTRAINT "PK_AspNetUserLogins" PRIMARY KEY ("LoginProvider", "ProviderKey"),
        CONSTRAINT "FK_AspNetUserLogins_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE TABLE "AspNetUserRoles" (
        "UserId" uuid NOT NULL,
        "RoleId" uuid NOT NULL,
        CONSTRAINT "PK_AspNetUserRoles" PRIMARY KEY ("UserId", "RoleId"),
        CONSTRAINT "FK_AspNetUserRoles_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_AspNetUserRoles_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE TABLE "AspNetUserTokens" (
        "UserId" uuid NOT NULL,
        "LoginProvider" text NOT NULL,
        "Name" text NOT NULL,
        "Value" text,
        CONSTRAINT "PK_AspNetUserTokens" PRIMARY KEY ("UserId", "LoginProvider", "Name"),
        CONSTRAINT "FK_AspNetUserTokens_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE INDEX "IX_AspNetRoleClaims_RoleId" ON "AspNetRoleClaims" ("RoleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE UNIQUE INDEX "RoleNameIndex" ON "AspNetRoles" ("NormalizedName");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE INDEX "IX_AspNetUserClaims_UserId" ON "AspNetUserClaims" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE INDEX "IX_AspNetUserLogins_UserId" ON "AspNetUserLogins" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE INDEX "IX_AspNetUserRoles_RoleId" ON "AspNetUserRoles" ("RoleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE INDEX "EmailIndex" ON "AspNetUsers" ("NormalizedEmail");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    CREATE UNIQUE INDEX "UserNameIndex" ON "AspNetUsers" ("NormalizedUserName");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012040830_AddIdentity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261012040830_AddIdentity', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261013021245_AddDataProtectionKeys') THEN
    CREATE TABLE "DataProtectionKeys" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "FriendlyName" text,
        "Xml" text,
        CONSTRAINT "PK_DataProtectionKeys" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261013021245_AddDataProtectionKeys') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261013021245_AddDataProtectionKeys', '10.0.12');
    END IF;
END $EF$;
COMMIT;

