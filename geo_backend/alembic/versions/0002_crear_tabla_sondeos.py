"""crear tabla sondeos

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-19

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '0002'
down_revision: Union[str, Sequence[str], None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'sondeos',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('proyecto_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('codigo', sa.String(30), nullable=False),
        sa.Column('tipo', sa.String(20), nullable=False),
        sa.Column('latitud', sa.Numeric(10, 7), nullable=False),
        sa.Column('longitud', sa.Numeric(10, 7), nullable=False),
        sa.Column('cota', sa.Numeric(8, 2), nullable=True),
        sa.Column('profundidad_total', sa.Numeric(6, 2), nullable=True),
        sa.Column('estado', sa.String(20), nullable=False, server_default='abierto'),
        sa.Column('firma_digital', sa.Text, nullable=True),
        sa.Column('device_id', sa.String(64), nullable=False),
        sa.Column('sync_status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('version', sa.Integer, nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['proyecto_id'], ['proyectos.id'], ondelete='RESTRICT'),
    )
    op.create_index('ix_sondeos_proyecto_id', 'sondeos', ['proyecto_id'])


def downgrade() -> None:
    op.drop_index('ix_sondeos_proyecto_id', table_name='sondeos')
    op.drop_table('sondeos')