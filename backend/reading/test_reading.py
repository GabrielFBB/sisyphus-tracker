import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from reading.models import Book


@pytest.fixture
def user(db):
    return User.objects.create_user(username="gabriel", password="segredo123")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(username="outra", password="segredo123")


@pytest.fixture
def client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


class TestBookDefaults:
    def test_estado_por_defeito_e_por_ler(self, user):
        livro = Book.objects.create(user=user, title="O Estrangeiro", author="Camus")
        assert livro.status == "want"

    def test_nao_possuido_por_defeito(self, user):
        livro = Book.objects.create(user=user, title="O Estrangeiro", author="Camus")
        assert livro.owned is False

    def test_sem_avaliacao_por_defeito(self, user):
        livro = Book.objects.create(user=user, title="O Estrangeiro", author="Camus")
        assert livro.rating is None


class TestBookRating:
    def test_aceita_avaliacao_com_decimais(self, user):
        livro = Book.objects.create(user=user, title="Meditacoes", author="Marco Aurelio", rating=8.5)
        livro.refresh_from_db()
        assert livro.rating == 8.5

    def test_atualiza_avaliacao_pela_api(self, client, user):
        livro = Book.objects.create(user=user, title="1984", author="Orwell", status="done")
        res = client.patch(f"/api/books/{livro.id}/", {"rating": 9.5}, format="json")
        assert res.status_code == 200
        livro.refresh_from_db()
        assert livro.rating == 9.5


class TestBookIsolation:
    def test_lista_apenas_livros_do_proprio(self, client, user, other_user):
        Book.objects.create(user=user, title="Meu livro", author="A")
        Book.objects.create(user=other_user, title="Livro alheio", author="B")
        res = client.get("/api/books/")
        assert res.status_code == 200
        assert [b["title"] for b in res.json()] == ["Meu livro"]

    def test_nao_apaga_livro_de_outro(self, client, other_user):
        alheio = Book.objects.create(user=other_user, title="Alheio", author="B")
        res = client.delete(f"/api/books/{alheio.id}/")
        assert res.status_code == 404
        assert Book.objects.filter(id=alheio.id).exists()

    def test_criar_atribui_o_utilizador_autenticado(self, client, user):
        res = client.post("/api/books/", {"title": "Novo", "author": "Autor"}, format="json")
        assert res.status_code == 201
        assert Book.objects.get(id=res.json()["id"]).user == user


class TestBookAuth:
    def test_sem_token_recusa(self, db):
        assert APIClient().get("/api/books/").status_code == 401
