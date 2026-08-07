"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-08-06

Bootstrap migration that creates the complete schema matching the SQLAlchemy
models. It is written to be idempotent (uses IF NOT EXISTS guards) so it can
run safely on both brand-new databases and on legacy databases that were
previously initialised from database/schema.sql.
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---- Enum types (guarded: Postgres has no CREATE TYPE IF NOT EXISTS) ----
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
                CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'EMPLOYEE');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_enum') THEN
                CREATE TYPE priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
                CREATE TYPE task_status_enum AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status_enum') THEN
                CREATE TYPE project_status_enum AS ENUM ('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_type_enum') THEN
                CREATE TYPE request_type_enum AS ENUM ('LEAVE', 'WFH', 'WFBO');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status_enum') THEN
                CREATE TYPE request_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
            END IF;
        END
        $$;
        """
    )

    # ---- 1. roles ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS roles (
            id          SERIAL PRIMARY KEY,
            name        user_role_enum NOT NULL UNIQUE,
            description TEXT
        );
        """
    )

    # ---- 2. users (circular FK to projects added later) ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            role_id            INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
            full_name          VARCHAR(120) NOT NULL,
            email              VARCHAR(255) NOT NULL UNIQUE,
            password_hash      VARCHAR(255) NOT NULL,
            department         VARCHAR(100),
            designation        VARCHAR(100),
            is_active          BOOLEAN DEFAULT TRUE,
            current_project_id UUID,
            preferences        JSONB
        );
        """
    )

    # ---- 3. projects (circular FKs to users added later) ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS projects (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name                VARCHAR(200) NOT NULL,
            description         TEXT,
            start_date          DATE NOT NULL,
            end_date            DATE,
            priority            priority_enum DEFAULT 'MEDIUM',
            status              project_status_enum DEFAULT 'PLANNING',
            progress_percentage NUMERIC(5, 2) DEFAULT 0.00,
            owner_id            UUID,
            created_by          UUID,
            created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    # ---- 4. project_assignments ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS project_assignments (
            project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
            user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (project_id, user_id)
        );
        """
    )

    # ---- 5. tasks ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            title           VARCHAR(250) NOT NULL,
            description     TEXT,
            priority        priority_enum DEFAULT 'MEDIUM',
            status          task_status_enum DEFAULT 'NOT_STARTED',
            assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
            due_date        DATE,
            attachment_url  VARCHAR(500),
            attachment_name VARCHAR(250),
            created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    # ---- 6. task_updates ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS task_updates (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            project_id              UUID REFERENCES projects(id) ON DELETE SET NULL,
            task_id                 UUID REFERENCES tasks(id) ON DELETE SET NULL,
            report_date             DATE NOT NULL DEFAULT CURRENT_DATE,
            morning_planned_work    TEXT,
            morning_task_title      TEXT,
            morning_status          task_status_enum,
            morning_est_hours       NUMERIC(4, 2),
            morning_blockers        TEXT,
            morning_submitted_at    TIMESTAMP WITH TIME ZONE,
            evening_completed_work  TEXT,
            evening_remaining_work  TEXT,
            evening_hours_spent     NUMERIC(4, 2),
            evening_challenges      TEXT,
            evening_next_day_plan   TEXT,
            evening_submitted_at    TIMESTAMP WITH TIME ZONE,
            attachment_url          VARCHAR(500),
            attachment_name         VARCHAR(250),
            is_locked               BOOLEAN DEFAULT FALSE,
            created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_user_daily_report UNIQUE (user_id, report_date)
        );
        """
    )

    # ---- 7. leave_requests ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS leave_requests (
            id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            request_type request_type_enum NOT NULL,
            start_date   DATE NOT NULL,
            end_date     DATE NOT NULL,
            reason       TEXT NOT NULL,
            status       request_status_enum DEFAULT 'PENDING',
            reviewed_by  UUID REFERENCES users(id),
            admin_comment TEXT,
            created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    # ---- 8. notifications ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS notifications (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title      VARCHAR(200) NOT NULL,
            message    TEXT NOT NULL,
            is_read    BOOLEAN DEFAULT FALSE,
            link       VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    # ---- 9. audit_logs ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS audit_logs (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
            action_type VARCHAR(100) NOT NULL,
            ip_address  VARCHAR(45),
            details     JSONB,
            created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    # ---- 10. meetings ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS meetings (
            id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title        VARCHAR(255) NOT NULL,
            description  TEXT,
            date         DATE NOT NULL,
            start_time   VARCHAR(5) NOT NULL,
            end_time     VARCHAR(5),
            meeting_link VARCHAR(500),
            created_by   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    # ---- 11. meeting_assignees ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS meeting_assignees (
            meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
            user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
            PRIMARY KEY (meeting_id, user_id)
        );
        """
    )

    # ---- 12. company_holidays ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS company_holidays (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name        VARCHAR(255) NOT NULL,
            description TEXT,
            date        DATE NOT NULL,
            created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    # ---- 13. project_chats ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS project_chats (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message    TEXT NOT NULL,
            file_url   VARCHAR(500),
            file_name  VARCHAR(250),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    # ---- 14. project_requests ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS project_requests (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            reason        TEXT,
            status        request_status_enum DEFAULT 'PENDING',
            reviewed_by   UUID REFERENCES users(id),
            admin_comment TEXT,
            created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    # ---- Backfill columns that newer models added after schema.sql era ----
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS current_project_id UUID;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB;")
    op.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id UUID;")
    op.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500);")
    op.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(250);")
    op.execute("ALTER TABLE task_updates ADD COLUMN IF NOT EXISTS morning_task_title TEXT;")
    op.execute("ALTER TABLE task_updates ADD COLUMN IF NOT EXISTS morning_status task_status_enum;")
    op.execute("ALTER TABLE task_updates ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500);")
    op.execute("ALTER TABLE task_updates ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(250);")
    op.execute("ALTER TABLE meetings ADD COLUMN IF NOT EXISTS end_time VARCHAR(5);")
    op.execute("ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500);")

    # ---- Circular FKs between users and projects (guarded) ----
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_current_project_id_fkey') THEN
                ALTER TABLE users ADD CONSTRAINT users_current_project_id_fkey
                    FOREIGN KEY (current_project_id) REFERENCES projects(id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_owner_id_fkey') THEN
                ALTER TABLE projects ADD CONSTRAINT projects_owner_id_fkey
                    FOREIGN KEY (owner_id) REFERENCES users(id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_created_by_fkey') THEN
                ALTER TABLE projects ADD CONSTRAINT projects_created_by_fkey
                    FOREIGN KEY (created_by) REFERENCES users(id);
            END IF;
        END
        $$;
        """
    )

    # ---- Indexes ----
    op.execute("CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_task_updates_user_date ON task_updates(user_id, report_date);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_project_chats_project ON project_chats(project_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_project_requests_user ON project_requests(user_id);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS project_requests CASCADE;")
    op.execute("DROP TABLE IF EXISTS project_chats CASCADE;")
    op.execute("DROP TABLE IF EXISTS company_holidays CASCADE;")
    op.execute("DROP TABLE IF EXISTS meeting_assignees CASCADE;")
    op.execute("DROP TABLE IF EXISTS meetings CASCADE;")
    op.execute("DROP TABLE IF EXISTS audit_logs CASCADE;")
    op.execute("DROP TABLE IF EXISTS notifications CASCADE;")
    op.execute("DROP TABLE IF EXISTS leave_requests CASCADE;")
    op.execute("DROP TABLE IF EXISTS task_updates CASCADE;")
    op.execute("DROP TABLE IF EXISTS tasks CASCADE;")
    op.execute("DROP TABLE IF EXISTS project_assignments CASCADE;")
    op.execute("DROP TABLE IF EXISTS projects CASCADE;")
    op.execute("DROP TABLE IF EXISTS users CASCADE;")
    op.execute("DROP TABLE IF EXISTS roles CASCADE;")

    op.execute("DROP TYPE IF EXISTS request_status_enum;")
    op.execute("DROP TYPE IF EXISTS request_type_enum;")
    op.execute("DROP TYPE IF EXISTS project_status_enum;")
    op.execute("DROP TYPE IF EXISTS task_status_enum;")
    op.execute("DROP TYPE IF EXISTS priority_enum;")
    op.execute("DROP TYPE IF EXISTS user_role_enum;")
