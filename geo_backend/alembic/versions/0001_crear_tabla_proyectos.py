"""crear tabla proyectos

Revision ID: 0001
Revises:
Create Date: 2026-06-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '0001'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'proyectos',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('nombre', sa.String(120), nullable=False),
        sa.Column('cliente', sa.String(120), nullable=False),
        sa.Column('responsable', sa.String(80), nullable=False),
        sa.Column('ubicacion', sa.String(200), nullable=True),
        sa.Column('fecha_inicio', sa.Date(), nullable=True),
        sa.Column('device_id', sa.String(64), nullable=False),
        sa.Column('sync_status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )


def downgrade() -> None:
    op.drop_table('proyectos') 