App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;

      try{
        await window.ethereum.request({ method: "eth_requestAccounts"});
      } catch {
        console.log("User denied connection");
      }
    }

    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Adoption.json", function(data) {
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact); // ABI

      App.contracts.Adoption.setProvider(App.web3Provider); // ADDRESS

      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: function() {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;
      
      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      for(var i = 0; i < adopters.length; i++){
        if(adopters[i] !== '0x0000000000000000000000000000000000000000'){
          $(`.btn-adopt[data-id=${i}]`).text("Adoptado").attr("disabled", true);
        }
      }
    }).catch(function(error){
      console.log(error);
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    web3.eth.getAccounts(function(error, accounts){
      if(error){
        console.log(error);
        return;
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance){
        return instance.adopt(petId, {from: account});

      }).then(function(result){
        return App.markAdopted();
      }).catch(function(err){
        console.log(err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
